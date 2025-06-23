import Image from "next/image";

type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-md shadow-sm border border-gray-200 bg-white">
      <Image src={icon} alt={title} width={40} height={40} />
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600 text-sm">{description}</p>
      </div>
    </div>
  );
}
